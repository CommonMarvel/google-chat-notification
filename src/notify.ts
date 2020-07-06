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

  return {
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
                  )}">${pullRequest.title}</font> has been ${
                    pullRequest.merged ? 'merged' : pullRequest.state
                  }</br>`
                }
              }
            ]
          },
          {
            widgets: [
              {
                keyValue: {
                  topLabel: `${owner}/${repo}`,
                  content: pullRequest.head.ref,
                  bottomLabel: pullRequest.user.login
                }
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
}

async function processPullRequestComment(): Promise<object> {
  const commentPayload = github.context
    .payload as Webhooks.WebhookPayloadPullRequestReviewComment
  const pullRequest = commentPayload.pull_request
  const comment = commentPayload.comment
  return {
    cards: [
      {
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b>Comment to <font color="#ff9800">${pullRequest.title}</font></br>`
                }
              }
            ]
          },
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Comment from',
                  content: comment.user.login,
                  button: {
                    textButton: {
                      text: 'CHECK',
                      onClick: {
                        openLink: {
                          url: comment.html_url
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}

async function processRelease(): Promise<object> {
  const releasePayload = github.context
    .payload as Webhooks.WebhookPayloadRelease
  return {
    cards: [
      {
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b><font color="#009393">${releasePayload.repository.full_name}: ${releasePayload.release.tag_name}</font></br>`
                }
              }
            ]
          },
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Release by',
                  content: releasePayload.release.author.login,
                  button: {
                    textButton: {
                      text: 'CHECK',
                      onClick: {
                        openLink: {
                          url: releasePayload.release.html_url
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  }
}

export async function sendMessage(url: string): Promise<void> {
  core.info(github.context.eventName)
  core.info(JSON.stringify(github.context.payload))
  let body = null
  if (github.context.eventName === 'pull_request') {
    body = await processPullRequest()
  } else if (github.context.eventName === 'pull_request_review_comment') {
    body = await processPullRequestComment()
  } else if (github.context.eventName === 'release') {
    body = await processRelease()
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
