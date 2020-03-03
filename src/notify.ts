import * as core from '@actions/core'
import * as github from '@actions/github'
import {WebhookPayloadPullRequestPullRequest} from '@octokit/webhooks'
import * as Webhooks from '@octokit/webhooks'
import axios from 'axios'

interface TextButton {
  textButton: {text: string; onClick: {openLink: {url: string}}}
}

function getTextColor(state: string): string {
  switch (state) {
    case 'closed':
      return '#ff0000'
    default:
      return '#2cbe4e'
  }
}

const textButton = (text: string, url: string): TextButton => ({
  textButton: {
    text,
    onClick: {openLink: {url}}
  }
})

const getBottomWidgets = (
  pullRequest: WebhookPayloadPullRequestPullRequest
): {buttons: TextButton[]}[] => {
  return pullRequest.state === 'closed'
    ? []
    : [
        {
          buttons: [textButton('GOTO REVIEW', pullRequest.html_url)]
        }
      ]
}

export async function sendMessage(url: string): Promise<void> {
  if (github.context.eventName === 'pull_request') {
    const {owner, repo} = github.context.repo
    const pullRequestPayload = github.context
      .payload as Webhooks.WebhookPayloadPullRequest
    const pullRequest = pullRequestPayload.pull_request
    core.info(
      `${pullRequest.title} ${pullRequest.state} by ${pullRequest.user.login}`
    )

    const body = {
      cards: [
        {
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<b><font color="${getTextColor(
                      pullRequest.state
                    )}">${pullRequest.title}</font></b>`
                  }
                }
              ]
            },
            {
              widgets: [
                {
                  keyValue: {
                    topLabel: 'repository',
                    content: `${owner}/${repo}`,
                    contentMultiline: true,
                    button: textButton(
                      'OPEN REPOSITORY',
                      pullRequestPayload.repository.html_url
                    )
                  }
                },
                {
                  keyValue: {topLabel: 'ref', content: pullRequest.head.ref}
                },
                {
                  keyValue: {
                    topLabel: 'author',
                    content: pullRequest.user.login
                  }
                }
              ]
            },
            {
              widgets: getBottomWidgets(pullRequest)
            }
          ]
        }
      ]
    }

    const response = await axios.post(url, body)
    if (response.status !== 200) {
      throw new Error(
        `Google Chat notification failed. response status=${response.status}`
      )
    }
  }
}
