package merchant;

import java.util.List;

//Define merchant operations.

public interface MerchantService {
    MerchantResponse addMerchant(MerchantRequest request);
    MerchantResponse updateMerchant(Long merchantId, MerchantRequest request);
    void deleteMerchant(Long merchantId);
    MerchantResponse getMerchantById(Long merchantId);
    List<MerchantResponse> getAllMerchants();
}
