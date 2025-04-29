import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "An error occurred");
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure the URL is relative to avoid CSP issues
  const apiUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Try to get token from multiple sources
  let token = localStorage.getItem('token');
  
  // Fallback to sessionStorage if localStorage token is missing
  if (!token) {
    token = sessionStorage.getItem('token');
    if (token) {
      console.log("Using fallback token from sessionStorage");
      // Restore to localStorage
      localStorage.setItem('token', token);
    }
  }
  
  // Debug token
  if (token) {
    console.log("Using token for request:", token.substring(0, 10) + '...');
  } else {
    console.log("No token found for request");
  }
  
  const res = await fetch(apiUrl, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Ensure the URL is relative to avoid CSP issues
    const apiUrl = url.startsWith('/') ? url : `/${url}`;
    
    // Try to get token from multiple sources
    let token = localStorage.getItem('token');
    
    // Fallback to sessionStorage if localStorage token is missing
    if (!token) {
      token = sessionStorage.getItem('token');
      if (token) {
        console.log("Using fallback token from sessionStorage");
        // Restore to localStorage
        localStorage.setItem('token', token);
      }
    }
    
    // Debug token
    if (token) {
      console.log(`Fetching data for key: ${apiUrl} with token: ${token.substring(0, 10)}...`);
    } else {
      console.log(`Fetching data for key: ${apiUrl} without token`);
    }
    
    const res = await fetch(apiUrl, {
      credentials: "include",
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        "Accept": "application/json"
      }
    });

    console.log(`Response status for ${apiUrl}: ${res.status}`);
    
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`Response data for ${apiUrl}:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
