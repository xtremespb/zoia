import requests;
import json;
import time;
import sys, os;

# trigger pipeline in GitLab

GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
TRIGGER_PIPELINE_URL = 'https://gitlab.com/api/v4/projects/19934840/trigger/pipeline?token=' + str(GITLAB_TOKEN) + '&ref=master'

trigger_response = requests.post(TRIGGER_PIPELINE_URL)
print(trigger_response)
pipeline_id = json.loads(trigger_response.text)['id']


# prepare GET request to check pipeline status

PIPELINE_STATUS_URL = 'https://gitlab.com/api/v4/projects/19934840/pipelines/' + str(pipeline_id)
GITLAB_READ_TOKEN = os.environ.get('GITLAB_READ_TOKEN')
headers = {}
headers['content-type'] = 'application/json'
headers['PRIVATE-TOKEN'] = GITLAB_READ_TOKEN
headers['Accept-Charset'] = 'UTF-8'

# wait for pipeline to finish

status = "running";
while(status == "running" or status == "pending"):
  time.sleep(30)
  response = requests.get(url=PIPELINE_STATUS_URL, headers=headers)
  print(response)
  status = json.loads(response.text)["status"]
  print(status)

if(status != "success"):
  print(status)
  sys.exit(1)
