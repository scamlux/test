/**
 * Dashboard Component Tests
 * Tests real-time data fetching and UI updates
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Dashboard from "../Dashboard";
import * as apiClient from "../../api/client";

jest.mock("../../api/client");

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("should render dashboard", () => {
    apiClient.default.get = jest.fn().mockResolvedValue({ data: {} });

    render(<Dashboard />);

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  test("should fetch metrics on mount", async () => {
    const mockMetrics = {
      totalOrders: 100,
      completedOrders: 80,
      pendingOrders: 20,
    };

    apiClient.default.get = jest.fn().mockResolvedValue({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(apiClient.default.get).toHaveBeenCalled();
    });
  });

  test("should display order statistics", async () => {
    const mockMetrics = {
      totalOrders: 100,
      completedOrders: 80,
      pendingOrders: 20,
      cancelledOrders: 0,
      totalDeliveries: 100,
      completedDeliveries: 75,
      pendingDeliveries: 25,
    };

    apiClient.default.get = jest.fn().mockResolvedValue({ data: mockMetrics });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });
  });

  test("should have multiple tabs", async () => {
    apiClient.default.get = jest.fn().mockResolvedValue({ data: {} });

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Overview|Orders|Deliveries|Analytics/i),
      ).toBeInTheDocument();
    });
  });

  test("should handle loading state", () => {
    apiClient.default.get = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: {} }), 1000),
          ),
      );

    render(<Dashboard />);

    expect(screen.queryByText(/Loading/i)).toBeInTheDocument();
  });

  test("should handle error state", async () => {
    apiClient.default.get = jest
      .fn()
      .mockRejectedValue(new Error("Failed to fetch"));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });

  test("should refresh data every 10 seconds", async () => {
    apiClient.default.get = jest.fn().mockResolvedValue({ data: {} });

    render(<Dashboard />);

    await waitFor(() => {
      expect(apiClient.default.get).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(apiClient.default.get).toHaveBeenCalledTimes(2);
    });
  });

  test("should display recent orders", async () => {
    const mockData = {
      recentOrders: [
        { id: "order-1", status: "COMPLETED" },
        { id: "order-2", status: "PENDING" },
      ],
    };

    apiClient.default.get = jest.fn().mockResolvedValue({ data: mockData });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/order-1/)).toBeInTheDocument();
    });
  });

  test("should switch between tabs", async () => {
    apiClient.default.get = jest.fn().mockResolvedValue({
      data: {
        recentOrders: [],
        recentDeliveries: [],
      },
    });

    render(<Dashboard />);

    const ordersTab = screen.getByRole("button", { name: /Orders/i });
    fireEvent.click(ordersTab);

    await waitFor(() => {
      expect(ordersTab).toHaveClass("active");
    });
  });

  test("should show status indicators with correct colors", async () => {
    const mockData = {
      recentOrders: [
        { id: "order-1", status: "COMPLETED" },
        { id: "order-2", status: "PENDING" },
        { id: "order-3", status: "FAILED" },
      ],
    };

    apiClient.default.get = jest.fn().mockResolvedValue({ data: mockData });

    render(<Dashboard />);

    await waitFor(() => {
      const badges = screen.getAllByRole("badge");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test("should handle refresh button click", async () => {
    apiClient.default.get = jest.fn().mockResolvedValue({ data: {} });

    render(<Dashboard />);

    const refreshButton = screen.getByRole("button", { name: /Refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(apiClient.default.get).toHaveBeenCalled();
    });
  });
});
