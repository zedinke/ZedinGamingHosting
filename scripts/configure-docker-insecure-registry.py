#!/usr/bin/env python3
import json
import subprocess

docker_config = {
    "insecure-registries": ["116.203.226.140:5000"],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}

# Write to remote via ssh
config_json = json.dumps(docker_config, indent=2)
print(f"Docker config to apply:\n{config_json}\n")

# Apply to GameServer-1
cmd = f'''ssh -i C:\\Users\\gelea\\.ssh\\webserver_key root@95.217.194.148 "python3 << 'EOFPYTHON'
import json
config = {repr(docker_config)}
with open('/etc/docker/daemon.json', 'w') as f:
    json.dump(config, f, indent=2)
print('Config written')
EOFPYTHON
"'''

print(f"Running: {cmd}")
result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)
