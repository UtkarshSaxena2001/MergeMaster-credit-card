package merchant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

//Represent merchant table data

@Entity
@Table(name = "merchant")
public class Merchant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "merchant_id")
    private long merchantID;

    @Column(name = "merchant_name", nullable = false, length = 100)
    private String merchantName;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(length = 100)
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
