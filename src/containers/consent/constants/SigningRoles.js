/*
 * @flow
 */

type SigningRoleEnum = {|
  CLIENT :'CLIENT';
  STAFF :'STAFF';
  WITNESS :'WITNESS';
|};

// TODO: look into using Immutable.Map() or other possible "enum" libraries
const SigningRoles :{|...SigningRoleEnum |} = Object.freeze({
  CLIENT: 'CLIENT',
  STAFF: 'STAFF',
  WITNESS: 'WITNESS',
});

type SigningRole = $Values<typeof SigningRoles>;

export default SigningRoles;
export type {
  SigningRole,
  SigningRoleEnum,
};
