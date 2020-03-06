<p align="center">
  <a href="https://github.com/CommonMarvel/google-chat-notification/actions"><img alt="google-chat-notification status" src="https://github.com/CommonMarvel/google-chat-notification/workflows/build-test/badge.svg"></a>
</p>

### Usage

Add `notify.yml` to `.github/workflows/`

```yaml
name: notify
on:
  pull_request:
    types: [opened, reopened, closed]
  pull_request_review_comment:
    types: [created]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
    - name: Google Chat Notification
      uses: CommonMarvel/google-chat-notification@master
      with:
        url: ${{ secrets.GOOGLE_CHAT_WEBHOOK }}
```
