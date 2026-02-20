import {
  getBusinessAutocomplete as getBusinessAutocompleteFromBusiness,
  verifyPanForBranch,
  verifyGstForBranch,
} from "./business.services";

export const getBusinessAutocomplete = async (input) => {
  return getBusinessAutocompleteFromBusiness(input);
};

export const verifyPan = async ({ pan, branch_id }) => {
  return verifyPanForBranch({ pan, branch_id });
};

export const verifyGstin = async ({ gstin, branch_id }) => {
  return verifyGstForBranch({ gstin, branch_id });
};
