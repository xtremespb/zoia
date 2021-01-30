import requests;
import json;
import time;
import sys, os;

# send GitHub commit to GitLab, thereby triggering pipeline
    
GITLAB_TOKEN = os.environ.get('GITLAB_TOKEN')
 
GITLAB_BRANCH = os.environ.get('GITLAB_BRANCH')
print("GitLab branch to send commit to = " + GITLAB_BRANCH)

COMMIT_MESSAGE = os.environ.get('github.event.head_commit.message')
print("Commit message to send to GitLab: " + COMMIT_MESSAGE)

GITHUB_BRANCH = os.environ.get('GITHUB_HEAD_REF')
print("Commit branch to be cloned in GitLab = " + GITHUB_BRANCH)


