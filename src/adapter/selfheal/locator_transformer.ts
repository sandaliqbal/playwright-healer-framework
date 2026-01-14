import { LocatorDescriptor } from './models';
import { findElementsByText } from './snapshot_helper';
import { ARIA_ROLES, AriaRole, toAriaRole } from './roles';

type MatchTuple = [
  text: string,
  rootParent?: string,
  currentParent?: string
];

export class LocatorTransformer {
  /**
   * Returns a refined locator or null if deterministic narrowing fails
   */
  transform(params: {
    original: LocatorDescriptor;
    snapshot: any[];
  }): LocatorDescriptor[] | null {
    const { original, snapshot } = params;

    const matches = findElementsByText(snapshot, original.value!);

    // 1️⃣ Upgrade to ROLE if possible
    const roleLocators = this.toRole(matches);
    if (roleLocators.length) return roleLocators;

    // 2️⃣ Upgrade to TEXT if possible
    const textLocators = this.toText(matches);
    if (textLocators.length) return textLocators;

    // 3️⃣ Add landmark / parent scope
    const scopedLocator = this.addParentScope(matches, original);
    if (scopedLocator) return [scopedLocator];

    // No safe narrowing possible → escalate
    return null;
  }

  private static ROLE_NAME_RE =
    /(?:-\s*)?(?<role>[a-zA-Z_]+)\s+"(?<name>[^"]+)"/;

  private extractRoleAndName(
    line: string
  ): { role?: string; name?: string } {
    const match = line.match(LocatorTransformer.ROLE_NAME_RE);
    if (!match || !match.groups) return {};

    return {
      role: match.groups.role,
      name: match.groups.name
    };
  }

  private toRole(matches: MatchTuple[]): LocatorDescriptor[] {
    const roles: LocatorDescriptor[] = [];

    for (const [text, rootParent, currentParent] of matches) {
      const { role, name } = this.extractRoleAndName(text);
      if (!role || !ARIA_ROLES.has(role)) continue;

      const loc = new LocatorDescriptor({
        strategy: 'role',
        value: name!,
        role: toAriaRole(role),
        name,
        landmark: rootParent?.split(' ')[0],
        scope: currentParent?.split(' ')[0],
        exact: true
      });

      roles.push(loc);
    }

    return roles;
  }

  private toText(matches: MatchTuple[]): LocatorDescriptor[] {
    const texts: LocatorDescriptor[] = [];

    for (const [text, rootParent, currentParent] of matches) {
      if (currentParent !== 'text') continue;

      const loc = new LocatorDescriptor({
        strategy: 'text',
        value: text,
        role: undefined,
        name: undefined,
        landmark: rootParent?.split(' ')[0],
        scope: currentParent?.split(' ')[0],
        exact: true
      });

      texts.push(loc);
    }

    return texts;
  }

  private addParentScope(
    matches: MatchTuple[],
    locator: LocatorDescriptor
  ): LocatorDescriptor | null {
    const parents = new Set<string>();

    for (const [, parent, scope] of matches) {
      if (parent && scope && ARIA_ROLES.has(scope)) {
        parents.add(parent.split(' ')[0]);
      }
    }

    if (parents.size === 1) {
      const [parent] = [...parents];

      return new LocatorDescriptor({
        strategy: 'scoped_role',
        value: locator.role!,
        name: locator.name,
        landmark: parent
      });
    }

    return null;
  }
}
