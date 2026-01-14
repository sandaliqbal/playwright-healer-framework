export const ARIA_ROLES = new Set<string>([
  // Landmarks
  'banner',
  'navigation',
  'main',
  'contentinfo',
  'search',
  'form',
  'region',

  // Widgets
  'button',
  'link',
  'textbox',
  'checkbox',
  'radio',
  'combobox',
  'listbox',
  'option',
  'menu',
  'menuitem',
  'tab',
  'tabpanel',

  // Structure
  'heading',
  'list',
  'listitem',
  'table',
  'row',
  'cell',
  'separator',

  // Media
  'img',
]);

export enum AriaRole {
  // Landmarks
  Banner = 'banner',
  Navigation = 'navigation',
  Main = 'main',
  ContentInfo = 'contentinfo',
  Search = 'search',
  Form = 'form',
  Region = 'region',

  // Widgets
  Button = 'button',
  Link = 'link',
  Textbox = 'textbox',
  Checkbox = 'checkbox',
  Radio = 'radio',
  Combobox = 'combobox',
  Listbox = 'listbox',
  Option = 'option',
  Menu = 'menu',
  MenuItem = 'menuitem',
  Tab = 'tab',
  TabPanel = 'tabpanel',

  // Structure
  Heading = 'heading',
  List = 'list',
  ListItem = 'listitem',
  Table = 'table',
  Row = 'row',
  Cell = 'cell',
  Separator = 'separator',

  // Media
  Img = 'img',
}

export function toAriaRole(value: string): AriaRole | undefined {
  return Object.values(AriaRole).includes(value as AriaRole)
    ? (value as AriaRole)
    : undefined;
}
