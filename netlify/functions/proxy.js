import axios from "axios";
import http from "http"; // добавляем http агент

export async function handler(event) {
  const endpoint = event.queryStringParameters.endpoint;
  const params = { ...event.queryStringParameters };
  delete params.endpoint;

  console.log("Proxy request →", endpoint, params);

  try {
    const response = await axios.get(`http://109.73.206.144:6969/api/${endpoint}`, {
      params,
      // важная часть ↓
      httpAgent: new http.Agent({ rejectUnauthorized: false }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    };
  } catch (error) {
    console.error("Proxy error:", error.response?.status, error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        message: "Ошибка при запросе к API",
        details: error.message,
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    };
  }
}
