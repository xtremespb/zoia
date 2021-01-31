import requests;
import json;
import time;
import sys, os;


####################################
### global constants ###############
####################################
PULL_REQUEST = "pull_request";
GITLAB_CREATE_COMMIT_URL = 'https://gitlab.com/api/v4/projects/19934840/repository/commits'
GITLAB_GET_COMMIT_URL = 'https://gitlab.com/api/v4/projects/19934840/repository/commits/'
GITLAB_COMMIT_TOKEN = os.environ.get('GITLAB_CREATE_COMMIT')
GITLAB_READ_TOKEN = os.environ.get('GITLAB_READ_TOKEN')
GITLAB_BRANCH = os.environ.get('GITLAB_BRANCH')
print("GitLab branch to send commit to = " + GITLAB_BRANCH)
GITHUB_COMMIT_MESSAGE = os.environ.get('COMMIT_MESSAGE')
GITLAB_PIPELINE_STATUS_URL = 'https://gitlab.com/api/v4/projects/19934840/pipelines/'

####################################
### functions#######################
####################################
def createFileContentForGitLab():
 if GITLAB_BRANCH == PULL_REQUEST :
  return os.environ.get('PULL_REQUEST_NUMBER')
 else :
  return os.environ.get('GITHUB_COMMIT_MESSAGE')


def createCommitMessageForGitlab():
 if GITLAB_BRANCH == PULL_REQUEST :
  return "Pull request number " + os.environ.get('PULL_REQUEST_NUMBER') + " in GitHub. Title: " + os.environ.get('PULL_REQUEST_TITLE')
 else :
  return "GitHub message: " + os.environ.get('GITHUB_COMMIT_MESSAGE')
  
def createDataForCommitRequest():
  fileContent = createFileContentForGitLab()
  action = {"action": "update", "file_path": "from_GitHub.txt", "content": fileContent}
  commit_message = createCommitMessageForGitlab()
  data = {'commit_message': commit_message, 'branch': GITLAB_BRANCH, 'actions' : [action]}
  print("Data to send to GitLab: " + json.dumps(data))
  return data

def createCommitInGitLab(data):
  print("Creating commit for GitLab")
  HEADERS = {'PRIVATE-TOKEN' : str(GITLAB_COMMIT_TOKEN), 'Content-type': 'application/json'}
  
  # send POST request to create new commit in GitLab
  return requests.post(GITLAB_CREATE_COMMIT_URL, json=data, headers=HEADERS)

def getPipelineIdFromGitLab(commit_id):
 # send GET request to find the pipeline triggered by this commit
 HEADERS = {'PRIVATE-TOKEN' : str(GITLAB_COMMIT_TOKEN)}
 pipeline = None
 counter = 0
 while (pipeline is None) and (counter < 300):
  print("Waiting for the pipeline for the triggered commit on GitLab")
  time.sleep(30)
  counter += 30
  get_commit_response = requests.get(GITLAB_GET_COMMIT_URL + str(commit_id), headers=HEADERS)
  print("Response from GitLab to the request for the triggered commit " + get_commit_response.text)
  pipeline = json.loads(get_commit_response.text)['last_pipeline']
 
 return pipeline['id'] 

def waitForPipelineToFinish(pipeline_id):
 HEADERS = {'PRIVATE-TOKEN' : str(GITLAB_READ_TOKEN), 'content-type' : 'application/json', 'Accept-Charset' : 'UTF-8'}

 # wait one hour for pipeline to finish 
 status = "running";
 counter = 0
 while((status == "running" or status == "pending") and (counter < 3600)):
   time.sleep(30)
   counter += 30
   response = requests.get(url=GITLAB_PIPELINE_STATUS_URL + str(pipeline_id), headers=HEADERS)
   print(response)
   status = json.loads(response.text)["status"]
   print("Current pipeline status: " + status)
 return status


def triggerGitlab():
  # send GitHub commit to GitLab, thereby triggering pipeline
  create_commit_response = createCommitInGitLab(createDataForCommitRequest())
  print("Response to posting commit to GitLab: " + create_commit_response.text)
  commit_id = json.loads(create_commit_response.text)['id']
  print("Commit id in GitLab: " + commit_id)
  pipeline_id = getPipelineIdFromGitLab(commit_id)
  pipeline_status = waitForPipelineToFinish(pipeline_id)
  if(pipeline_status != "success"):
   sys.exit(1)
  
#####################################################################################
#####################################################################################
if __name__ == "__main__":
  triggerGitlab()
  
