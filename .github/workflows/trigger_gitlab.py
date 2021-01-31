import requests;
import json;
import time;
import sys, os;

# constants
PULL_REQUEST = "pull_request";

# send GitHub commit to GitLab, thereby triggering pipeline

GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
 
GITLAB_BRANCH = os.environ.get('GITLAB_BRANCH')
print("GitLab branch to send commit to = " + GITLAB_BRANCH)

if GITLAB_BRANCH == PULL_REQUEST :
  COMMIT_MESSAGE = os.environ.get('PULL_REQUEST_TITLE')
  print("Commit message to send to GitLab: " + COMMIT_MESSAGE)

  PULL_REQUEST_NUMBER = os.environ.get('PULL_REQUEST_NUMBER')
  print("Pull request to be cloned in GitLab is number " + PULL_REQUEST_NUMBER)


