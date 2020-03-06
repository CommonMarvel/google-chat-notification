import * as core from '@actions/core'
import * as github from '@actions/github'
import * as Webhooks from '@octokit/webhooks'
import axios from 'axios'

interface TextButton {
  textButton: {text: string; onClick: {openLink: {url: string}}}
}

function getTextColor(state: string, isMerged: boolean): string {
  if (isMerged) {
    return '#6f42c1'
  }

  if (state === 'closed') {
    return '#ff0000'
  }

  return '#2cbe4e'
}

const textButton = (text: string, url: string): TextButton => ({
  textButton: {
    text,
    onClick: {openLink: {url}}
  }
})

async function processPullRequest(): Promise<object> {
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
                    pullRequest.state,
                    pullRequest.merged
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
          }
        ]
      }
    ]
  }

  if (pullRequest.state !== 'closed') {
    body.cards[0].sections.push({
      widgets: [
        {
          buttons: [textButton('GOTO REVIEW', pullRequest.html_url)]
        }
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  return body
}

async function processPullRequestComment(): Promise<object> {
  const comment = github.context
    .payload as Webhooks.WebhookPayloadPullRequestReviewComment
  core.info(JSON.stringify(comment))
  const body = {text: 'new comment'}
  return body
}

export async function sendMessage(url: string): Promise<void> {
  let body = null
  if (github.context.eventName === 'pull_request') {
    body = await processPullRequest()
  } else if (github.context.eventName === 'pull_request_review_comment') {
    body = await processPullRequestComment()
  } else {
    core.info(`event: ${github.context.eventName} not pull_request`)
    return
  }

  const response = await axios.post(url, body)
  if (response.status !== 200) {
    throw new Error(
      `Google Chat notification failed. response status=${response.status}`
    )
  }
}
