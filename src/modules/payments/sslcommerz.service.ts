
import axios from "axios";

interface SSLCommerzPaymentData {
    transactionId: string;
    amount: number;
    serviceName: string;

    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
}

const initializeSSLCommerz = async (
    paymentData: SSLCommerzPaymentData
) => {
    try {
        const storeId = process.env.SSLCOMMERZ_STORE_ID;
        const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
        const backendUrl = process.env.BACKEND_URL;

        if (!storeId || !storePassword || !backendUrl) {
            throw new Error("SSLCommerz environment variables are missing");
        }

        // Validate transaction amount
        if (
            !Number.isFinite(paymentData.amount) ||
            paymentData.amount < 10 ||
            paymentData.amount > 500000
        ) {
            throw new Error("Payment amount must be between 10 and 500000 BDT");
        }

        const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";

        const gatewayUrl = isLive
            ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
            : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

        const formData = new URLSearchParams();

        // Merchant credentials
        formData.append("store_id", storeId);
        formData.append("store_passwd", storePassword);

        // Transaction information
        formData.append("total_amount", paymentData.amount.toFixed(2));
        formData.append("currency", "BDT");
        formData.append("tran_id", paymentData.transactionId);

        // Callback URLs
        formData.append("success_url", `${backendUrl}/api/payments/online/success`);
        formData.append("fail_url", `${backendUrl}/api/payments/online/fail`);
        formData.append("cancel_url", `${backendUrl}/api/payments/online/cancel`);
        formData.append("ipn_url", `${backendUrl}/api/payments/online/ipn`);

        // Product information
        formData.append("product_name", paymentData.serviceName);
        formData.append("product_category", "home_service");
        formData.append("product_profile", "general");
        formData.append("shipping_method", "NO");

        // Customer information
        formData.append("cus_name", paymentData.customer.name);
        formData.append("cus_email", paymentData.customer.email);
        formData.append("cus_phone", paymentData.customer.phone);

        formData.append("cus_add1", paymentData.customer.address);
        formData.append("cus_city", "Chattogram");
        formData.append("cus_postcode", "4000");
        formData.append("cus_country", "Bangladesh");

        const response = await axios.post(
            gatewayUrl,
            formData.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 20000
            }
        );

        if (
            response.data.status !== "SUCCESS" ||
            !response.data.GatewayPageURL
        ) {
            throw new Error(
                response.data.failedreason ||
                "Unable to initialize SSLCommerz payment"
            );
        }

        return {
            status: response.data.status,
            gatewayUrl: response.data.GatewayPageURL,
            sessionKey: response.data.sessionkey
        };

    } catch (error: any) {
        console.error(
            "SSLCommerz initialization error:",
            error.response?.data || error.message
        );

        throw new Error(
            error.response?.data?.failedreason ||
            error.message ||
            "SSLCommerz initialization failed"
        );
    }
};

export default initializeSSLCommerz;
