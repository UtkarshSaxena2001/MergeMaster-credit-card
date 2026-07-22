package merchant;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;

    public MerchantServiceImpl(MerchantRepository merchantRepository) {
        this.merchantRepository = merchantRepository;
    }

    @Override
    public MerchantResponse addMerchant(MerchantRequest request) {
        Merchant merchant = mapToEntity(request);
        return mapToResponse(merchantRepository.save(merchant));
    }

    @Override
    public MerchantResponse updateMerchant(Long merchantId, MerchantRequest request) {
        Merchant merchant = validateMerchantExists(merchantId);
        merchant.setMerchantName(request.getMerchantName());
        merchant.setCategory(request.getCategory());
        merchant.setLocation(request.getLocation());
        return mapToResponse(merchantRepository.save(merchant));
    }

    @Override
    public void deleteMerchant(Long merchantId) {
        Merchant merchant = validateMerchantExists(merchantId);
        merchantRepository.delete(merchant);
    }

    @Override
    public MerchantResponse getMerchantById(Long merchantId) {
        return mapToResponse(validateMerchantExists(merchantId));
    }

    @Override
    public List<MerchantResponse> getAllMerchants() {
        return merchantRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    private Merchant mapToEntity(MerchantRequest request) {
        Merchant merchant = new Merchant();
        merchant.setMerchantName(request.getMerchantName());
        merchant.setCategory(request.getCategory());
        merchant.setLocation(request.getLocation());
        return merchant;
    }

    private MerchantResponse mapToResponse(Merchant merchant) {
        MerchantResponse response = new MerchantResponse();
        response.setMerchantId(merchant.getMerchantId());
        response.setMerchantName(merchant.getMerchantName());
        response.setCategory(merchant.getCategory());
        response.setLocation(merchant.getLocation());
        return response;
    }

    private Merchant validateMerchantExists(Long merchantId) {
        return merchantRepository.findById(merchantId)
                .orElseThrow(() -> new MerchantNotFoundException("Merchant not found with id: " + merchantId));
    }
}
