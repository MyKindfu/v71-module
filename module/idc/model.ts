


/** 二代证读卡结果信息类型 */
export interface IDData {
  /* base info */
  base: IDDataBase | null
  /* avatar image file path */
  imagePath: string
  /* SAM id */
  samid: string
  /* 合成图片文件路径 */
  compositePath: string
}

export interface IDDataBase {
  /** 姓名 */
  name: string
  /** 1男，2女 */
  gender: number
  genderName: string
  /** 民族代码 */
  nation: string
  /** 民族中文 */
  nationName: string
  /** 出生日期 */
  birth: string
  /** 住址 */
  address: string
  /** 身份证号 */
  idc: string
  /** 签发机关 */
  regorg: string
  /** 有效期开始 */
  startdate: string
  /** 有效期结束 日期或者'长期' */
  enddate: string
}
