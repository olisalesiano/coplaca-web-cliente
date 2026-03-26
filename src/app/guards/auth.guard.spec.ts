import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AppRole, AuthStore } from '../core/auth.store';

function createRouteWithRoles(roles?: AppRole[]): ActivatedRouteSnapshot {
  const route = new ActivatedRouteSnapshot();
  (route as { data: { roles?: AppRole[] } }).data = roles ? { roles } : {};
  return route;
}

describe('AuthGuard', () => {
  let authStoreMock: {
    isLoggedIn: () => boolean;
    hasAnyRole: (roles: AppRole[]) => boolean;
    getDefaultRouteForCurrentRole: () => string;
  };
  let routerMock: Pick<Router, 'navigate'>;
  let navigateCalls: string[][];
  let hasAnyRoleCalls: AppRole[][];
  let guard: AuthGuard;

  beforeEach(() => {
    navigateCalls = [];
    hasAnyRoleCalls = [];

    authStoreMock = {
      isLoggedIn: () => true,
      hasAnyRole: (roles: AppRole[]) => {
        hasAnyRoleCalls.push(roles);
        return true;
      },
      getDefaultRouteForCurrentRole: () => '/client/our-products',
    };

    routerMock = {
      navigate: (commands: string[]) => {
        navigateCalls.push(commands);
        return Promise.resolve(true);
      },
    };

    guard = new AuthGuard(authStoreMock as AuthStore, routerMock as Router);
  });

  it('denies access when user is not authenticated', () => {
    authStoreMock.isLoggedIn = () => false;

    const result = guard.canActivate(createRouteWithRoles(['admin']));

    expect(result).toBe(false);
    expect(navigateCalls).toContain(['/login']);
  });

  it('allows access to route without role restrictions', () => {
    authStoreMock.isLoggedIn = () => true;

    const result = guard.canActivate(createRouteWithRoles());

    expect(result).toBe(true);
    expect(navigateCalls.length).toBe(0);
  });

  it('allows admin user in admin routes', () => {
    authStoreMock.isLoggedIn = () => true;
    authStoreMock.hasAnyRole = (roles: AppRole[]) => {
      hasAnyRoleCalls.push(roles);
      return true;
    };

    const result = guard.canActivate(createRouteWithRoles(['admin']));

    expect(result).toBe(true);
    expect(hasAnyRoleCalls).toContain(['admin']);
  });

  it('blocks customer from logistics routes and redirects to default role home', () => {
    authStoreMock.isLoggedIn = () => true;
    authStoreMock.hasAnyRole = (roles: AppRole[]) => {
      hasAnyRoleCalls.push(roles);
      return false;
    };
    authStoreMock.getDefaultRouteForCurrentRole = () => '/client/our-products';

    const result = guard.canActivate(createRouteWithRoles(['logistics']));

    expect(result).toBe(false);
    expect(navigateCalls).toContain(['/client/our-products']);
  });

  it('blocks logistics from admin routes and redirects to logistics home', () => {
    authStoreMock.isLoggedIn = () => true;
    authStoreMock.hasAnyRole = (roles: AppRole[]) => {
      hasAnyRoleCalls.push(roles);
      return false;
    };
    authStoreMock.getDefaultRouteForCurrentRole = () => '/logistics/orders';

    const result = guard.canActivate(createRouteWithRoles(['admin']));

    expect(result).toBe(false);
    expect(navigateCalls).toContain(['/logistics/orders']);
  });
});
