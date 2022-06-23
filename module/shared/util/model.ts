
export type PlainText = string
export type Base64Text = string

export const enum DataURISchemePrefix {
  gif = 'data:image/gif;base64,',
  html = 'data:text/html,',
  jpg = 'data:image/jpeg;base64,',
  png = 'data:image/png;base64,',
  plain = 'data:text/plain,',
}
