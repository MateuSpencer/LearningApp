# LearningApp


## Index

- [Requirements](#requirements)
- [Installation](#installation)
- [Where to go from here?](#where-to-go-from-here)
- [Versioning](#versioning)
- [Style Guide](#style-guide)
- [Debugging](#debugging)
- [Deployment](#deployment)
- [Merge conflicts](#merge-conflicts)
- [Git hooks](#git-hooks)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)


## Requirements

- Python 3.11+
- Pip
- Virtualenv (or the package manage of your choice)
- Node 20
- Docker ([Install instructions](#how-do-i-install-docker-on-macoswindows))
- [mkcert](https://github.com/FiloSottile/mkcert)


## Installation

1. Setup container .env files (configures environment variables for Docker containers)

    ```
    cp docker/config/python.example.env docker/config/python.env
    ```

2. Include this ip on your hosts-file (enables local domain name resolution)

    ```
    127.0.0.1 learningapp.com.test
    ```

    On windows you can run this command to append it:

    ```
    echo 127.0.0.1 learningapp.com.test >> c:\windows\System32\drivers\etc\hosts
    ```

3. Add root cert for SSL (allows your browser to trust locally-generated certificates): 
    ```
    mkcert -install
    ```

4. Generate SSL certs for local development (enables HTTPS on your local site)
    ```
    mkcert --cert-file docker/files/certs/cert.pem --key-file docker/files/certs/cert-key.pem learningapp.com.test
    ```

5. Enable SSL in Nginx (configures the web server to use the SSL certificates)
    ```
    sed -i.bak 's/\#mkcert\ //g' docker/files/config/nginx.conf.template
    rm -f docker/files/config/nginx.conf.template.bak
    ```
    
    Alternatively, you can use the included script:
    ```
    ./scripts/enable_ssl.sh
    ```

6. Start the Docker containers (launches the backend services: Wagtail, database, and Nginx)
    ```
    docker compose up -d
    ```
   
   **Linux users:** Add the following to your docker-compose.yml for the `web` container:
   ```yml
   services:
     web:
       ...
       extra_hosts: 
         - "host.docker.internal:host-gateway"
   ```

7. Initialize the database (first time only, sets up the database structure)
    ```
    ./scripts/manage.sh migrate
    ./scripts/manage.sh createsuperuser  # If you need a custom admin user
    ```

8. Setup and start the frontend (runs the Next.js frontend development server)
    ```
    cd frontend
    nvm use  # Make sure you're using Node 20
    npm i
    npm run dev
    ```

9. Visit your site:
   - Frontend: [https://learningapp.com.test:8082](https://learningapp.com.test:8082)
   - Wagtail admin: [https://learningapp.com.test:8082/wt/cms](https://learningapp.com.test:8082/wt/cms) 
     (Username: `admin` and password: `admin`)

10. (Optional) Set up Git hooks for development workflow (automates version bumping, testing, and code validation)
    ```bash
    # Version bumping
    chmod +x $PWD/.githooks/bump-version.sh
    ln -nfs $PWD/.githooks/bump-version.sh .git/hooks/post-flow-release-start
    ln -nfs $PWD/.githooks/bump-version.sh .git/hooks/post-flow-hotfix-start
    
    # Test suite before push
    chmod +x $PWD/.githooks/pre-push.sh
    ln -nfs $PWD/.githooks/pre-push.sh .git/hooks/pre-push
    
    # Code style validation on commit
    chmod +x $PWD/.githooks/pre-commit.sh
    ln -nfs $PWD/.githooks/pre-commit.sh .git/hooks/pre-commit
    ```

11. (Optional) Configure Git Flow for streamlined development (provides structured branching model for features, releases, and hotfixes)
    ```
    git flow init
    ```
    
    Use the following recommended settings:
    - Branch name for production releases: `master`
    - Branch name for development: `develop`
    - Feature branches: `feature/`
    - Bugfix branches: `bugfix/`
    - Release branches: `release/`
    - Hotfix branches: `hotfix/`
    - Support branches: `support/`
    - Version tag prefix: `v`


## Where to go from here?

We recommend you to check out our [Getting Started Guide](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/getting-started-guide.md). Otherwise, you can read up any of the following topics:

- [Frontend Developer Guide](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/frontend-developer-guide.md)
- [Backend Developer Guide](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/backend-developer-guide.md)
- [Provision and configure a webserver for hosting](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/provisioning-servers-for-hosting.md)
- [Setting up deployment on CircleCI](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/setting-up-deployment-with-circleci.md)
- [Adding Slack notifications to CircleCI](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/adding-slack-notifications-to-circleci.md)
- [Sync data between environments](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/sync-data-between-environments.md)
- [Running python locally](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/running-python-locally.md)
- [Using static site generation](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/using-static-site-generation.md)
- [Working with Wagtail's routable pages](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/working-with-wagtails-routable-pages.md)
- [Serving custom content type data through Next.js](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/serving-custom-content-type-data-through-nextjs.md)
- [Adding multi language support](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/adding-multi-language-support.md)
- [Adding wagtail-2fa support](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/adding-wagtail-2fa-support.md)
- [Adding Sentry](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/adding-sentry.md)
- [Handling CSRF Tokens](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/handling-csrf-tokens.md)
- [Scaffolding](https://github.com/Frojd/Wagtail-Pipit/blob/main/docs/scaffolding.md)


## Versioning

This project follows [semantic versioning](https://semver.org/).

Bump version in:

- src/pipit/settings/base.py `(APP_VERSION=)`
- frontend/package.json
- src/Dockerfile

...or just use the [bump-version](#bump-version) git hook


## Style Guide

We follow the [django coding style](https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/), which is based on [PEP8](https://www.python.org/dev/peps/pep-0008).


## Debugging

### VS Code

This project is configured for remote debugging using VS Code with the official Python extension. Set `VS_CODE_REMOTE_DEBUG=True` in `docker/config/python.env` and restart your container to enable it.
You should now be able to attach to the running Django server instance.

[PTVSD](https://github.com/Microsoft/ptvsd) (Python Tools for Visual Studio debug server) is configured to listen for connections on port 5678.

### pdb in Docker

To use pdb you need to start the container with service-ports exposed instead of docker compose up. This will create a container called `<project_prefix>_python_run_1`

```
docker compose run --rm --service-ports python
```


## Deployment

This project uses CircleCI for CI/CD to automatically deploy to staging and production environments. The deployment process involves provisioning your server first (which is done from your local machine), then setting up CircleCI for continuous deployment.

### Server Requirements

Your web servers need:
- Linux (Ubuntu 20.04+ recommended)
- Nginx
- uWSGI
- Python 3.11+
- PostgreSQL 12+ with PostGIS
- GDAL
- Node 20+
- PM2

Users required on the server:
- "root" - Used when provisioning web server
- "deploy" - Used for deployment (both need passwordless login with SSH keys)

### 1. Server Provisioning (from your local machine)

First, configure your server connection details:

```bash
# Edit the stage.yml file to contain your server information
nano deploy/stages/stage.yml
```

The file should look like this (update with your actual server details):
```yml
webservers:
  hosts:
    stage1:
      ansible_user: deploy
      ansible_port: 22
      ansible_host: stage.learningapp.com
      domain: stage.learningapp.com
      stage_name: stage
```

Make sure your local machine has SSH access to the server:

1. If you haven't already, generate an SSH key pair:
   ```bash
   ssh-keygen -t ed25519
   ```

2. Add your public key to the server's authorized_keys:
   ```bash
   ssh-copy-id deploy@stage.learningapp.com
   ssh-copy-id root@stage.learningapp.com  # Also needed for provisioning
   ```

3. Test the SSH connection:
   ```bash
   ssh deploy@stage.learningapp.com
   ssh root@stage.learningapp.com
   ```

Now you can proceed with the provisioning:

```bash
# Step 1: Navigate to the deploy directory and create a virtual environment
cd deploy
python3 -m venv venv
. venv/bin/activate

# Step 2: Install Ansible and dependencies
pip install -r requirements.txt

# Step 3: Verify connection to your server
ansible -i stages/stage.yml webservers -m ping
# You should see a "SUCCESS" message

# Step 4: Install Ansistrano (deployment tool)
ansible-galaxy install -r requirements.yml

# Step 5: Run the provisioning playbook for staging
ansible-playbook provision.yml -i stages/stage.yml

# For production
ansible-playbook provision.yml -i stages/prod.yml
```

### 2. CircleCI Configuration

After server provisioning, set up CircleCI for automated deployments:

1. **Generate SSH Keys** (from your local machine):

   ```bash
   # For staging - don't use a passphrase
   ssh-keygen -t ed25519 -C "ci@learningapp.com" -f stage.learningapp.com
   
   # For production
   ssh-keygen -t ed25519 -C "ci@learningapp.com" -f learningapp.com
   ```

2. **Add Public Keys to Server**:

   ```bash
   # Copy the public key to your staging server
   cat stage.learningapp.com.pub | ssh deploy@stage.learningapp.com "cat >> ~/.ssh/authorized_keys"
   
   # Copy to production server
   cat learningapp.com.pub | ssh deploy@learningapp.com "cat >> ~/.ssh/authorized_keys"
   ```

3. **Add Private Keys to CircleCI**:
   - Login to CircleCI
   - Navigate to Project Settings > SSH Keys > Additional SSH Keys
   - Click "Add SSH Key"
   - For "Hostname" enter `stage.learningapp.com` or `learningapp.com`
   - For "Private key", paste the content of your key file
   - Repeat for both staging and production
   
4. **Optional: Delete Local SSH Keys**:
   Once you've verified your setup works, delete the keys from your local machine for security.

### 3. Sentry Configuration (Optional)

If you want error tracking, configure Sentry:

1. Create a [Sentry account and project](https://sentry.io/signup/)
2. Add these environment variables in CircleCI:
   - `NEXT_PUBLIC_SENTRY_DSN` - Your Sentry DSN
   - `SENTRY_AUTH_TOKEN` - Auth token with "Release: Admin" permissions
   - `SENTRY_ORG` - Your organization slug
   - `SENTRY_PROJECT` - Your project name

### 4. Deployment Workflow

Once configured, the deployment pipeline works as follows:

- **Develop Branch**: Pushes trigger build, tests, and deployment to staging
- **Tags**: Tags with pattern `v*.*.*` (e.g., `v1.2.3`) trigger production deployment
- **Feature Branches**: Only build and test, no deployment

The CircleCI configuration ignores changes to:
- `master` and `main` branches (by default)
- Files listed in `.ciignore`

### Manual Deployment

You can also deploy manually from your local machine:

```bash
cd deploy
python -m venv venv
. venv/bin/activate
pip install -r requirements.txt
ansible-galaxy install -r requirements.yml

# Deploy to staging
ansible-playbook deploy.yml -i stages/stage.yml

# Deploy to production
ansible-playbook deploy.yml -i stages/prod.yml
```

### Troubleshooting

- **PostGIS Extension Issue**: If you see `Permission denied to create extension "postgis"`:
  ```bash
  # On server as root
  psql
  \c mydb
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

- **Python Library Import Error**: The `--check` mode is not supported for the provision playbook


## Merge conflicts

### How to handle merge conflicts

1. **Identify the conflict**: When you try to merge branches, Git will notify you of conflicts.
2. **Open the conflicting files**: Open the files with conflicts in your code editor.
3. **Resolve the conflicts**: Manually edit the files to resolve the conflicts. Look for lines marked with `<<<<<<<`, `=======`, and `>>>>>>>`.
4. **Mark as resolved**: After resolving the conflicts, mark the files as resolved using `git add`.
5. **Commit the changes**: Commit the resolved files using `git commit`.

Example:

```bash
git add <resolved_file>
git commit -m "Resolved merge conflict in <resolved_file>"
```

## Git hooks

We use git-hooks to streamline and automate certain functions, such as version bumping and pre hooks for code validation and tests. If you want to bypass any of them append the `--no-verify` flag (example: `git push --no-verify`)

### Hook: Bump version

These hooks will automatically bump the application version when using `git flow release ...`

```bash
chmod +x $PWD/.githooks/bump-version.sh
ln -nfs $PWD/.githooks/bump-version.sh .git/hooks/post-flow-release-start
ln -nfs $PWD/.githooks/bump-version.sh .git/hooks/post-flow-hotfix-start
```

On windows

```
ln -nfs %cd%/.githooks/bump-version.sh .git/hooks/post-flow-release-start
ln -nfs %cd%/.githooks/bump-version.sh .git/hooks/post-flow-hotfix-start
```

### Hook: Run tests pre push

This hook will run the test suite before every push.

```bash
chmod +x $PWD/.githooks/pre-push.sh
ln -nfs $PWD/.githooks/pre-push.sh .git/hooks/pre-push
```

### Hook: Run styleguide validation on commit

```bash
chmod +x $PWD/.githooks/pre-commit.sh
ln -nfs $PWD/.githooks/pre-commit.sh .git/hooks/pre-commit
```


## FAQ

<details>

### How do I sync data from stage/prod?

You can rebuild your application with the latest data dump by running the following

```
./scripts/stage_to_local.sh
```

Note: This requires that you have ssh-key based access to the server.


### How do I install Docker on MacOS/Windows?

Read the instructions for [Mac OS](https://docs.docker.com/docker-for-mac/install/) or [Windows](https://docs.docker.com/docker-for-windows/install/) on docker.com.


### How do I run the test suite locally?

```
docker compose run --rm python test
```


### How do I run custom manage.py commands?

To run manage.py commands in docker is pretty straightforward, instead of targetting you local machine you just target your `python` container.

- Example: Create migrations

```
docker compose exec python ./manage.py makemigrations
```

- Example: Run migrations

```
docker compose exec python ./manage.py migrate
```

We also have a manage.sh script to make running management commands easier.

```
./scripts/manage.sh makemigrations
```


### How do I add new python dependencies?

First update your requirements/base.txt, then rebuild your container:

```
docker compose stop
docker compose up --build
```


### How do I install the application on the web server?

This project includes a provision script that sets up anything necessary to run the application (install db, add nginx/uwsgi conf).

```
ansible-playbook provision.yml -i stages/<stage>.yml
```

</details>


## Contributing

Want to contribute? Awesome. Just send a pull request.


## License


LearningApp is proprietary software. All rights reserved.

