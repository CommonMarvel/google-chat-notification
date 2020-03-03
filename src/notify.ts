import * as core from '@actions/core'
import * as github from '@actions/github'
import * as Webhooks from '@octokit/webhooks'
import axios from 'axios'

interface TextButton {
  textButton: {text: string; onClick: {openLink: {url: string}}}
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
    core.info(`${pullRequest.title} created by ${pullRequest.user.login}`)

    const body = {
      cards: [
        {
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `<b>PR has been ${pullRequest.state} <font color="#2cbe4e">${pullRequest.title}</font></b>`
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
                      pullRequestPayload.repository.url
                    )
                  }
                },
                {
                  keyValue: {
                    topLabel: 'event name',
                    content: github.context.eventName
                  }
                },
                {
                  keyValue: {topLabel: 'ref', content: github.context.ref}
                }
              ]
            },
            {
              widgets: [
                {
                  buttons: [textButton('OPEN CHECKS', pullRequest.url)]
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
