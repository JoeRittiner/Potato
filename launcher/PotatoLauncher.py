import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional, List, Any, Set

import inquirer
import yaml
from jinja2 import Template

from DockerErrorHandler import DockerErrorHandler


# --- Custom Exceptions ---

class PotatoLauncherError(Exception):
    """Base exception for all errors raised by the PotatoLauncher."""
    pass


class ConfigError(PotatoLauncherError):
    """Raised for configuration-related errors."""
    pass


class DockerError(PotatoLauncherError):
    """Raised for errors related to Docker operations."""
    pass


# --- Data Classes ---

@dataclass
class HealthCheckConfig:
    """
    Configuration for a service health check.

    :param port: The port on the container to target for the health check.
    :param path: The HTTP path to request for the health check (e.g., '/health').
    :param interval: The time in seconds between health check attempts.
    :param attempts: The maximum number of attempts before considering the service unhealthy.
    """
    port: int
    path: str
    interval: int = 5
    attempts: int = 5


@dataclass
class ImplementationConfig:
    """
    Configuration for a specific implementation of a service.

    :param name: The unique name of this implementation.
    :param service: The name of the service this implementation belongs to.
    :param docker_service_name: The name to use for the service in docker-compose.
    :param description: A human-readable description of the implementation.
    :param image: The Docker image to use for the service.
    :param container_name: Optional explicit name for the Docker container.
    :param environment: Environment variables to set for the container.
    :param volumes: A list of volume mappings (e.g., 'my-volume:/data').
    :param ports: A list of port mappings (e.g., '8080:80').
    :param health_check: Optional health check configuration.
    :param depends_on: A list of services this implementation depends on.
    """
    name: str
    service: str
    docker_service_name: str
    description: str
    image: str
    container_name: Optional[str] = None
    environment: Optional[Dict[str, Any]] = None
    volumes: Optional[List[str]] = None
    ports: Optional[List[str]] = None
    health_check: Optional[HealthCheckConfig] = None
    depends_on: Optional[List[str]] = field(default_factory=list)

    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.ports:
            for port in self.ports:
                if ":" not in port:
                    raise ConfigError(
                        f"Invalid port mapping in '{self.name}': '{port}'. Expected 'host:container' format.")

        if self.health_check and not self.ports:
            raise ConfigError(f"Implementation '{self.name}' has a health_check but no ports defined.")


@dataclass
class ServiceConfig:
    """
    Represents a service that can have multiple implementations.

    :param name: The name of the service (e.g., 'database', 'api').
    :param description: A human-readable description of the service's role.
    :param implementations: A dictionary mapping implementation names to their configs.
    """
    name: str
    description: str
    implementations: Dict[str, ImplementationConfig]


# --- File Utilities ---

def load_yaml_file(file_path: Path) -> Optional[dict]:
    """Load a YAML file and return its content, or None if it doesn't exist."""
    if not file_path.exists():
        return None
    with file_path.open() as f:
        return yaml.safe_load(f)


def save_yaml_file(file_path: Path, data: dict):
    """Save a dictionary to a YAML file."""
    with file_path.open("w") as f:
        yaml.dump(data, f, indent=2)


def load_text_file(file_path: Path) -> str:
    """Load a text file and return its content."""
    with file_path.open() as f:
        return f.read()


def save_text_file(file_path: Path, data: str):
    """Save a string to a text file."""
    with file_path.open("w") as f:
        f.write(data)


# --- Main Class ---

class PotatoLauncher:
    """
    Handles the selection, configuration, and launching of Docker services.
    """

    def __init__(self,
                 config_path: str = "services_config.yaml",
                 template_path: str = "templates/potato-launcher-compose.yml.jinja",
                 selection_path: str = "user_selection.yaml",
                 presets_dir: str = "Presets",
                 compose_output_path: str = "potato-launcher-compose.yml",
                 project_name: str = "potato"):
        """
        Initializes the PotatoLauncher with paths to necessary files.
        """
        self._service_config_file = Path(config_path)
        self._docker_compose_template_file = Path(template_path)
        self._user_selection_file = Path(selection_path)
        self._presets_dir = Path(presets_dir)
        self._docker_compose_output_file = Path(compose_output_path)
        self._project_name = project_name.lower()

        self._services_loaded: Dict[str, ServiceConfig] = {}
        self._selected_implementations: Dict[str, ImplementationConfig] = {}

        if not self._service_config_file.exists():
            raise ConfigError(f"Services configuration file not found at '{self._service_config_file}'")

    def load_services_config(self) -> Dict[str, ServiceConfig]:
        """
        Loads service definitions from the YAML configuration file.

        :return: A dictionary of loaded ServiceConfig objects.
        :raises ConfigError: If the configuration file is empty or invalid.
        """
        config_data = load_yaml_file(self._service_config_file)
        if not config_data:
            raise ConfigError(f"The configuration file '{self._service_config_file}' is empty or invalid.")

        for service_type, service_data in config_data.items():
            service_name = service_data.get("name", service_type)
            implementations = {}
            for impl_data in service_data.get("implementations", []):
                # Convert health_check dict to HealthCheckConfig object if present
                if "health_check" in impl_data and isinstance(impl_data["health_check"], dict):
                    impl_data["health_check"] = HealthCheckConfig(**impl_data["health_check"])
                impl = ImplementationConfig(**impl_data, service=service_name)
                implementations[impl.name] = impl

            self._services_loaded[service_name] = ServiceConfig(
                name=service_name,
                description=service_data.get("description", "No description provided."),
                implementations=implementations,
            )
        return self._services_loaded

    def select_implementations(self) -> bool:
        """
        Guides the user through selecting service implementations, either via presets or manually.

        :return: True if selections were made, False otherwise.
        """
        # First, attempt to load implementations from a preset
        selected = self._select_from_preset()

        # If no preset was chosen, fall back to manual selection
        if not selected:
            selected = self._select_manually()

        if not selected:
            print("No services selected. Exiting.")
            return False

        self._selected_implementations = selected
        return True

    def _select_from_preset(self) -> Optional[Dict[str, ImplementationConfig]]:
        """
        Prompts the user to select a preset and loads its configuration.

        :return: The selected implementations if a preset is chosen, otherwise None.
        """
        if not self._presets_dir.is_dir():
            return None

        presets = list(self._presets_dir.glob("*.yaml"))
        if not presets:
            return None

        questions = [
            inquirer.List(
                "preset",
                message="Select a preset or choose 'None' for manual setup",
                choices=[None] + sorted([p.stem for p in presets])
            )
        ]
        answers = inquirer.prompt(questions)
        selected_preset_name = answers["preset"] if answers else None

        if not selected_preset_name:
            return None

        print(f"Loading preset: '{selected_preset_name}'...")
        preset_path = self._presets_dir / f"{selected_preset_name}.yaml"
        preset_data = load_yaml_file(preset_path) or {}

        selected_implementations = {}
        for service_name, impl_name in preset_data.items():
            service = self._services_loaded.get(service_name)
            if not service:
                print(f"Warning: Service '{service_name}' from preset not found. Skipping.")
                continue

            implementation = service.implementations.get(impl_name)
            if not implementation:
                print(f"Warning: Implementation '{impl_name}' for service '{service_name}' not found. Skipping.")
                continue

            selected_implementations[service_name] = implementation
        return selected_implementations

    def _select_manually(self) -> Dict[str, ImplementationConfig]:
        """
        Prompts the user to manually select an implementation for each service.
        Saves the selections for future use.

        :return: A dictionary of the selected implementation configurations.
        """
        previous_selection = load_yaml_file(self._user_selection_file) or {}

        questions = [
            inquirer.List(
                service.name,
                message=f"Select implementation for '{service.name}' ({service.description})",
                choices=[(f"{impl.name} ({impl.description})", impl.name) for impl in
                         service.implementations.values()] + [("None", None)],
                default=previous_selection.get(service.name)
            )
            for service in self._services_loaded.values()
        ]

        answers = inquirer.prompt(questions)
        if not answers:  # Handle case where user exits prompt (e.g., Ctrl+C)
            return {}

        valid_selections = {k: v for k, v in answers.items() if v is not None}
        save_yaml_file(self._user_selection_file, valid_selections)

        return {
            service_name: self._services_loaded[service_name].implementations[impl_name]
            for service_name, impl_name in valid_selections.items()
        }

    def generate_docker_compose(self):
        """
        Generates the docker-compose.yml file from the selected implementations.
        """
        if not self._selected_implementations:
            print("No implementations selected. Cannot generate Docker Compose file.")
            return

        all_volumes: Set[str] = set()
        for impl in self._selected_implementations.values():
            if impl.volumes:
                all_volumes.update(impl.volumes)

        try:
            template_contents = load_text_file(self._docker_compose_template_file)
            template = Template(template_contents)
        except FileNotFoundError:
            raise ConfigError(f"Docker compose template not found at '{self._docker_compose_template_file}'")

        rendered_compose = template.render(
            project_name=self._project_name,
            implementations=self._selected_implementations,
            all_volumes=sorted(list(all_volumes))
        )

        save_text_file(self._docker_compose_output_file, rendered_compose)
        print(f"✅ Docker Compose file generated at '{self._docker_compose_output_file}'")

    def run_docker_compose_up(self) -> bool:
        """
        Runs `docker-compose up` and handles potential errors, such as conflicting containers.

        :return: True if the command succeeds, False otherwise.
        """
        if not self._handle_conflicting_containers():
            return False

        command = [
            "docker", "compose",
            "-f", str(self._docker_compose_output_file),
            "up", "--build", "-d"
        ]

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False  # We handle the error manually
            )

            if result.returncode == 0:
                print("✅ Docker Compose executed successfully.")
                return True
            else:
                print("❌ Docker Compose command failed.")
                handler = DockerErrorHandler(self._docker_compose_output_file)
                error_type = handler.handle_error(result.stderr)
                print(f"Error details: {error_type}")
                print(f"Error message: {result.stderr}")
                return False

        except FileNotFoundError:
            print("🚫 Docker or docker-compose is not installed or not in your PATH.")
            return False
        except Exception as e:
            print(f"🚨 An unexpected error occurred: {e}")
            return False

    def _handle_conflicting_containers(self) -> bool:
        """
        Checks for and prompts to remove running containers with conflicting names.

        :return: True if all conflicts are resolved, False otherwise.
        """
        try:
            conflicting_containers = self._get_conflicting_container_names()
        except DockerError as e:
            print(f"Error checking for conflicting containers: {e}")
            return False

        if not conflicting_containers:
            return True

        print("Found running containers that might conflict:")
        for container in conflicting_containers:
            print(f"  - {container}")

        return False

        questions = [
            inquirer.Confirm("remove", message="Stop and remove these containers?", default=False)
        ]
        answers = inquirer.prompt(questions)

        if answers and answers["remove"]:
            for container in conflicting_containers:
                print(f"Stopping and removing '{container}'...")
                if not self._remove_container(container):
                    print(f"Failed to remove container '{container}'. Aborting.")
                    return False
            return True
        else:
            print("Aborting launch due to conflicting containers.")
            return False

    def _get_conflicting_container_names(self) -> List[str]:
        """
        Identifies container names from the selection that already exist in Docker.

        :return: A list of conflicting container names.
        :raises DockerError: If the docker command fails.
        """
        try:
            result = subprocess.run(
                ["docker", "ps", "-a", "--format", "{{.Names}}"],
                capture_output=True, text=True, check=True
            )
            existing_containers = set(result.stdout.splitlines())
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            raise DockerError(f"Failed to list Docker containers: {e}")

        conflicting_names = []
        for impl in self._selected_implementations.values():
            container_name = impl.container_name or f"{self._project_name}_{impl.service}"

            if container_name in existing_containers:
                conflicting_names.append(container_name)
        return conflicting_names

    @staticmethod
    def _remove_container(container_name: str) -> bool:
        """Stops and removes a single Docker container."""
        try:
            subprocess.run(["docker", "stop", container_name], capture_output=True, check=False)
            subprocess.run(["docker", "rm", container_name], capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to remove container '{container_name}': {e.stderr}")
            return False

    def run_health_checks(self, max_workers: int = 10):
        """
        Runs health checks for all selected services in parallel.
        """
        if not self._selected_implementations:
            return

        print("\n🔬 Running health checks...")
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_service = {
                executor.submit(self._check_service_health, service): service
                for service in self._selected_implementations.values() if service.health_check
            }

            for future in as_completed(future_to_service):
                service = future_to_service[future]
                try:
                    is_healthy = future.result()
                    status = "✅ Healthy" if is_healthy else "❌ Unhealthy"
                    print(f"- {service.docker_service_name}: {status}")
                except Exception as e:
                    print(f"- {service.docker_service_name}: 🚨 Health check failed with an error: {e}")

    def _check_service_health(self, service: ImplementationConfig) -> bool:
        """
        Performs a health check on a single service.

        Note: This is a placeholder. You would implement your specific
        health check logic here (e.g., making an HTTP request).
        """
        if not service.health_check:
            return True  # No health check defined, so we consider it healthy.

        print(f"  (Checking {service.docker_service_name} on port {service.health_check.port}...)")
        #
        # --- TODO: Implement actual health check logic here ---
        # Example: Use `requests` to hit the health check endpoint.
        # import time
        # import requests
        #
        # for i in range(service.health_check.attempts):
        #     try:
        #         # Assuming the service is running on localhost
        #         url = f"http://localhost:{service.health_check.port}{service.health_check.path}"
        #         response = requests.get(url, timeout=2)
        #         if response.status_code == 200:
        #             return True
        #     except requests.exceptions.RequestException:
        #         pass # Ignore connection errors and retry
        #     time.sleep(service.health_check.interval)
        # return False
        return True  # Placeholder returns True for now

    def generate(self):
        """Generates the Docker Compose file based on the selected implementations."""

        try:
            self.load_services_config()
            if not self.select_implementations():
                return

            self.generate_docker_compose()
        except Exception as e:
            print(f"🚨 An unexpected error occurred: {e}")

    def launch(self):
        """
        Runs the full workflow: load, select, generate, launch, and health check.
        """
        try:
            if self.run_docker_compose_up():
                self.run_health_checks()
            else:
                print("\nSkipping health checks because service launch failed.")

        except PotatoLauncherError as e:
            print(f"\n🚫 An error occurred: {e}")
        except Exception as e:
            print(f"\n🚨 An unexpected critical error occurred: {e}")


def main():
    """Main entry point for the script."""
    launcher = PotatoLauncher()
    launcher.generate()
    launcher.launch()


if __name__ == '__main__':
    main()
