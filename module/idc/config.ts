
export const enum UrlList {
  /** 二代证读取 基础信息 */
  readBase = '//127.0.0.1:7701/idc/readbase',
  /** 二代证读取 包括生成图片 */
  readAll = '//127.0.0.1:7701/idc/readall',
  /** 读取指定本地路径图片 base64 */
  readImg = '//127.0.0.1:7701/bvo/readimg',
  /**
   * 二代证读取 基础信息
   *
   * @deprecated 使用 readBase 替代
   */
  read = '//127.0.0.1:7701/idc/read',
}
