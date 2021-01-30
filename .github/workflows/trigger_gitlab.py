import requests;
import json;
import time;
import sys, os;

# send GitHub commit to GitLab, thereby triggering pipeline

GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
BRANCH = sys.argv[1]
COMMIT_MESSAGE = sys.argv[2]

GITLAB_CREATE_COMMIT_URL = 'https://gitlab.com/api/v4/projects/19934840/repository/commits'
DATA = {'commit_message': COMMIT_MESSAGE, 'branch': BRANCH}
HEADERS = {'PRIVATE-TOKEN' : str(GITLAB_TOKEN), 'Content-type': 'application/json'}

# send POST request to create new commit in GitLab
post_commit_response = requests.post(GITLAB_CREATE_COMMIT_URL, data=DATA, headers=HEADERS)
print("Response to posting commit to GitLab: " + post_commit_response)
commit_id = json.loads(post_commit_response.text)['id']

# send GET request to find the pipeline triggered by this commit
GITLAB_GET_COMMIT_URL = 'https://gitlab.com/api/v4/projects/19934840/repository/commits/' + commit_id
HEADERS = {'PRIVATE-TOKEN' : str(GITLAB_TOKEN)}
get_commit_response = requests.get(GITLAB_GET_COMMIT_URL, headers=HEADERS)
print("Response to retrieving commit " + get_commit_response)
pipeline = json.loads(get_commit_response.text)['last_pipeline']
print("Pipeline " + pipeline)
pipeline_id = pipeline['id']
print("Pipeline ID " + pipeline_id)

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
