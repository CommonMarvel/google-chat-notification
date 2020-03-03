import core from '@actions/core'
import github from '@actions/github'
import Webhooks from '@octokit/webhooks'
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
                  keyValue: {
                    topLabel: 'event type',
                    content: pullRequest.state
                  }
                },
                {
                  keyValue: {topLabel: 'ref', content: pullRequest.head.ref}
                }
              ]
            },
            {
              widgets: [
                {
                  buttons: [textButton('GOTO REVIEW', pullRequest.html_url)]
                }
              ]
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
