import requests;
import json;
import time;
import sys, os;


####################################
### global constants ###############
####################################
PULL_REQUEST = "pull_request";
GITLAB_CREATE_COMMIT_URL = 'https://gitlab.com/api/v4/projects/19934840/repository/commits'
GITLAB_COMMIT_TOKEN = os.environ.get('GITLAB_CREATE_COMMIT')
GITLAB_BRANCH = os.environ.get('GITLAB_BRANCH')
print("GitLab branch to send commit to = " + GITLAB_BRANCH)
GITHUB_COMMIT_MESSAGE = os.environ.get('COMMIT_MESSAGE')

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
 

def triggerGitlab():
  # send GitHub commit to GitLab, thereby triggering pipeline
  create_commit_response = createCommitInGitLab(createDataForCommitRequest())
  print("Response to posting commit to GitLab: " + create_commit_response.text)
  commit_id = json.loads(create_commit_response.text)['id']
  print("Commit id in GitLab: " + commit_id)
  
#####################################################################################
#####################################################################################
if __name__ == "__main__":
  triggerGitlab()
