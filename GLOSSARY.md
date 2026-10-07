# OpenFit

OpenFit tracks fitness activity and supports self-hosted access through email/password and identity providers.

## Language

**First-user bootstrap**:
The initial setup opportunity while no OpenFit user exists, during which the first user can register despite registration restrictions and becomes an administrator.
_Avoid_: Registration bypass

**Registration policy**:
The rules governing creation of new OpenFit users through email/password, social login, or OIDC, including first-user bootstrap. An explicitly opted-in OIDC provider permits account creation even when general registration is disabled; an unrecognized creation origin does not confer permission.
_Avoid_: Sign-in policy

**Provider status**:
The public description of configured sign-in choices and currently available registration opportunities. Unavailable provider status is distinct from disabled registration and does not grant registration permission.
_Avoid_: Provider credentials

**Login flow**:
An OpenFit sign-in or registration attempt, from choosing email/password or an identity provider to obtaining a usable session or beginning an identity-provider redirect.
_Avoid_: Session refresh
