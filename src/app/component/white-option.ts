export interface WhiteOptionMeta {
  className?: string;
}


export interface WhiteOption {

  value: string | number;
  text: string;

  shortText?: string;
  children?: WhiteOption[];
  parent?: WhiteOption;
  meta?: WhiteOptionMeta;
  payload?: any;
}
