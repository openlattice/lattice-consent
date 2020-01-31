/*
 * @flow
 */

type SigningRoleEnum = {|
  CLIENT :'CLIENT';
  STAFF :'STAFF';
  WITNESS :'WITNESS';
|};
type SigningRole = $Values<SigningRoleEnum>;

// TODO: look into using Immutable.Map() or other possible "enum" libraries
const SigningRoles :{|...SigningRoleEnum |} = Object.freeze({
  CLIENT: 'CLIENT',
  STAFF: 'STAFF',
  WITNESS: 'WITNESS',
});

export default SigningRoles;
export type {
  SigningRole,
  SigningRoleEnum,
};
