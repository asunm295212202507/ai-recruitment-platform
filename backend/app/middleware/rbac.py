from typing import List, Callable
from fastapi import HTTPException, status, Depends
from backend.app.middleware.auth import get_current_tenant_user, TokenPayload

class PermissionChecker:
    def __init__(self, required_roles: List[str]):
        self.required_roles = required_roles

    def __call__(self, current_user: TokenPayload = Depends(get_current_tenant_user)) -> TokenPayload:
        # Super admin has global bypass
        if "super_admin" in current_user.roles:
            return current_user
            
        has_permission = any(role in current_user.roles for role in self.required_roles)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role lacks required permissions. Granted roles: {current_user.roles}. Required: {self.required_roles}"
            )
        return current_user
