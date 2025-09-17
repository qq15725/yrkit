// eslint-disable-next-line node/prefer-global/process
const count = Number(process.env.COUNT || 1000)

module.exports = {
  summary: '小红书',
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.includes('/api/sns/v4/note/user/posted')) {
      const newResponse = responseDetail.response
      const rawBody = newResponse.body.toString()
      const rep = JSON.parse(rawBody)
      rep.data.notes.forEach((note) => {
        note.badge_info.show_content = Number(note.view_count) + count
      })
      newResponse.body = JSON.stringify(rep)
      return {
        response: newResponse,
      }
    }
    else if (requestDetail.url.includes('/api/sns/v1/note/imagefeed')) {
      const newResponse = responseDetail.response
      const rawBody = newResponse.body.toString()
      const rep = JSON.parse(rawBody)
      rep.data.forEach((item) => {
        item.note_list.forEach((note) => {
          note.viewed_count = Number(note.viewed_count) + count
        })
      })
      newResponse.body = JSON.stringify(rep)
      return {
        response: newResponse,
      }
    }
    else if (requestDetail.url.includes('/api/sns/v4/note/videofeed')) {
      const newResponse = responseDetail.response
      const rawBody = newResponse.body.toString()
      const rep = JSON.parse(rawBody)
      rep.data.forEach((item) => {
        item.viewed_count = Number(item.viewed_count) + count
      })
      newResponse.body = JSON.stringify(rep)
      return {
        response: newResponse,
      }
    }
  },
}
