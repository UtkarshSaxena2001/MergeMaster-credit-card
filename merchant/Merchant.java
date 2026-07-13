package merchant;

//Represent merchant table data

public class Merchant {
    private long merchantID;
    private String merchantName;
    private String category;
    private String location;

    protected Merchant() {
        this.merchantID = 123456;
        this.merchantName = "Visa";
        this.category = "A";
        this.location = "Bangalore";
    }

    public Merchant(long merId,String merName,String cata,String loca) {
        this.merchantID = merId;
        this.merchantName = merName;
        this.category = cata;
        this.location = loca;
    }

    public long getMerchantID() {
        return this.merchantID;
    }

    public void setMerchantID(long merchantID) {
        this.merchantID = merchantID;
    }

    public String getMerchantName() {
        return this.merchantName;
    }

    public void setMerchantName(String merchantName) {
        this.merchantName = merchantName;
    }

    public String getCategory() {
        return this.category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return this.location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Merchant{");
        sb.append("merchantID=").append(merchantID);
        sb.append(", merchantName=").append(merchantName);
        sb.append(", category=").append(category);
        sb.append(", location=").append(location);
        sb.append('}');
        return sb.toString();
    }
}
