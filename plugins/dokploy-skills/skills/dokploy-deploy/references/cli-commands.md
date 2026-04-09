# Dokploy CLI Commands

Generated from `Dokploy/cli` command descriptions.

## Authentication

- `dokploy authenticate` - Authenticate the user by saving server URL and token
- `dokploy verify` - Verify if the saved authentication token is valid

## Project

- `dokploy project create` - Create a new project.
- `dokploy project info` - Get detailed information about a project, including the number of applications and databases.
- `dokploy project list` - List all projects.

## Application

- `dokploy app create` - Create a new application within a project.
- `dokploy app delete` - Delete an application from a project.
- `dokploy app deploy` - Deploy an application to a project.
- `dokploy app stop` - Stop an application from a project.

## Environment

- `dokploy env pull` - Store remote environment variables in local
- `dokploy env push` - Push dotenv file to remote service
- `dokploy environment create` - Create a new environment within a project.
- `dokploy environment delete` - Delete an environment from a project.

## Databases

- `dokploy database mariadb create` - Create a new MariaDB database within a project.
- `dokploy database mariadb delete` - Delete a MariaDB database from a project.
- `dokploy database mariadb deploy` - Deploy an mariadb to a project.
- `dokploy database mariadb stop` - Stop an mariadb from a project.
- `dokploy database mongo create` - Create a new MongoDB database within a project.
- `dokploy database mongo delete` - Delete a MongoDB database from a project.
- `dokploy database mongo deploy` - Deploy an mongo to a project.
- `dokploy database mongo stop` - Stop an mongo from a project.
- `dokploy database mysql create` - Create a new MySQL database within a project.
- `dokploy database mysql delete` - Delete a MySQL database from a project.
- `dokploy database mysql deploy` - Deploy an mysql to a project.
- `dokploy database mysql stop` - Stop an mysql from a project.
- `dokploy database postgres create` - Create a new PostgreSQL database within a project.
- `dokploy database postgres delete` - Delete a PostgreSQL database from a project.
- `dokploy database postgres deploy` - Deploy a PostgreSQL instance to a project.
- `dokploy database postgres stop` - Stop a PostgreSQL instance in a project.
- `dokploy database redis create` - Create a new Redis instance within a project.
- `dokploy database redis delete` - Delete a Redis instance from a project.
- `dokploy database redis deploy` - Deploy a Redis instance to a project.
- `dokploy database redis stop` - Stop a Redis instance in a project.

