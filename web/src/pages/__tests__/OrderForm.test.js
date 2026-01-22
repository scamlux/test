/**
 * OrderForm Component Tests
 * Tests order creation form
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import OrderForm from "../OrderForm";
import * as apiClient from "../../api/client";

jest.mock("../../api/client");

describe("OrderForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render order form", () => {
    render(<OrderForm />);

    expect(screen.getByText(/Create Order/i)).toBeInTheDocument();
  });

  test("should have product input field", () => {
    render(<OrderForm />);

    const productInput = screen.getByLabelText(/Product/i);
    expect(productInput).toBeInTheDocument();
  });

  test("should have quantity input field", () => {
    render(<OrderForm />);

    const quantityInput = screen.getByLabelText(/Quantity/i);
    expect(quantityInput).toBeInTheDocument();
  });

  test("should submit form with valid data", async () => {
    const mockCreateOrder = jest
      .fn()
      .mockResolvedValue({ data: { id: "order-new" } });
    apiClient.orderAPI.create = mockCreateOrder;

    render(<OrderForm />);

    const productInput = screen.getByLabelText(/Product/i);
    const quantityInput = screen.getByLabelText(/Quantity/i);
    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });

    await userEvent.type(productInput, "Wheat");
    await userEvent.type(quantityInput, "100");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          product: "Wheat",
          quantity: 100,
        }),
      );
    });
  });

  test("should validate required fields", async () => {
    render(<OrderForm />);

    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  test("should validate quantity is positive", async () => {
    render(<OrderForm />);

    const quantityInput = screen.getByLabelText(/Quantity/i);
    await userEvent.type(quantityInput, "-5");

    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/positive/i)).toBeInTheDocument();
    });
  });

  test("should display success message on submit", async () => {
    apiClient.orderAPI.create = jest
      .fn()
      .mockResolvedValue({ data: { id: "order-123" } });

    render(<OrderForm />);

    const productInput = screen.getByLabelText(/Product/i);
    const quantityInput = screen.getByLabelText(/Quantity/i);
    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });

    await userEvent.type(productInput, "Rice");
    await userEvent.type(quantityInput, "50");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/success|created/i)).toBeInTheDocument();
    });
  });

  test("should display error message on submit failure", async () => {
    apiClient.orderAPI.create = jest
      .fn()
      .mockRejectedValue(new Error("Failed to create order"));

    render(<OrderForm />);

    const productInput = screen.getByLabelText(/Product/i);
    const quantityInput = screen.getByLabelText(/Quantity/i);
    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });

    await userEvent.type(productInput, "Corn");
    await userEvent.type(quantityInput, "75");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  test("should clear form after successful submission", async () => {
    apiClient.orderAPI.create = jest
      .fn()
      .mockResolvedValue({ data: { id: "order-456" } });

    render(<OrderForm />);

    const productInput = screen.getByLabelText(/Product/i);
    const quantityInput = screen.getByLabelText(/Quantity/i);
    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });

    await userEvent.type(productInput, "Soybeans");
    await userEvent.type(quantityInput, "200");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(productInput.value).toBe("");
      expect(quantityInput.value).toBe("");
    });
  });

  test("should handle loading state during submission", async () => {
    apiClient.orderAPI.create = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: "order-789" } }), 1000),
          ),
      );

    render(<OrderForm />);

    const productInput = screen.getByLabelText(/Product/i);
    const quantityInput = screen.getByLabelText(/Quantity/i);
    const submitButton = screen.getByRole("button", { name: /Submit|Create/i });

    await userEvent.type(productInput, "Wheat");
    await userEvent.type(quantityInput, "150");
    fireEvent.click(submitButton);

    expect(screen.getByText(/submitting|loading/i)).toBeInTheDocument();
  });
});
