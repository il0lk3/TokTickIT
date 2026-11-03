import React from "react";
import CreateTicket from "../components/CreateTicket";
import { Category } from "../api";

interface CreateTicketRouteProps {
  categories: Category[];
}

export function CreateTicketRoute({ categories }: CreateTicketRouteProps) {
  return <CreateTicket categories={categories} />;
}

export default CreateTicketRoute;
