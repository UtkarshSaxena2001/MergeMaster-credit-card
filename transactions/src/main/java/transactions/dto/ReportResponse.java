package transactions.dto;

import java.math.BigDecimal;

public class ReportResponse {

    private String reportName;
    private BigDecimal amount;
    private String value;

    public ReportResponse() {
    }

    public ReportResponse(String reportName, BigDecimal amount, String value) {
        this.reportName = reportName;
        this.amount = amount;
        this.value = value;
    }

    public String getReportName() {
        return reportName;
    }

    public void setReportName(String reportName) {
        this.reportName = reportName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}