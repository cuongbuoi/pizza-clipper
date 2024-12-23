export interface Command {
  id: string
  action: CommandAction
  selector: string
  delay: number
}

export enum CommandAction {
  CLICK_ELEMENT = 'click_element',
  CLICK = 'click',
  SCROLL = 'scroll',
  SCROLL_UNTIL_END = 'scroll_until_end',
}

export type StorageCommands = Record<string, Command[]>
