import json

def get_config():
    with open('../lib/config.json', 'r') as f:
        return json.load(f)
