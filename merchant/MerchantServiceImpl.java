package merchant;

import java.util.List;

//Add, update, delete, fetch merchants.
//Map DTOs to entities and back.

//After jpa and rest

public class MerchantServiceImpl {
    private MerchantRepository merchantRepository;
    public MerchantResponse addMerchant(MerchantRequest request) {
        
    }

    public MerchantResponse updateMerchant(Long merchantId, MerchantRequest request) {

    }

    public void deleteMerchant(Long merchantId) {

    }

    public MerchantResponse getMerchantById(Long merchantId) {

    }

    public List<MerchantResponse> getAllMerchants() {

    }

    private Merchant mapToEntity(MerchantRequest request) {

    }

    private MerchantResponse mapToResponse(Merchant merchant) {

    }

    private Merchant validateMerchantExists(Long merchantId) {

    }

}
