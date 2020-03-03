import * as core from '@actions/core'
import {sendMessage} from './notify'

async function run(): Promise<void> {
  try {
    const url: string = core.getInput('url', {required: true})
    await sendMessage(url)
    core.info('sent message')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run().catch(e => core.info(e))
