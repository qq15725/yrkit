module.exports = {
  summary: '小红书',
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url.includes('/api/sns/v4/note/user/posted')) {
      const newResponse = responseDetail.response
      const rawBody = newResponse.body.toString()
      const rep = JSON.parse(rawBody)
      rep.data.notes.forEach((note) => {
        note.badge_info.show_content = note.view_count + 1000
      })
      newResponse.body = JSON.stringify(rep)
      return {
        response: newResponse,
      }
    }
  },
}
