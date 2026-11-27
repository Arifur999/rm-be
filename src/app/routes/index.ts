import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { CarRoutes } from "../module/car/car.route.js";
import { DashboardRoutes } from "../module/dashboard/dashboard.route.js";
import { DriverRoutes } from "../module/driver/driver.route.js";
import { ExpenseRoutes } from "../module/expense/expense.route.js";
import { TripRoutes } from "../module/trip/trip.route.js";
import { UserRoutes } from "../module/user/user.route.js";

const router = Router();

const moduleRoutes = [
    { path: "/auth", route: AuthRoutes },
    { path: "/cars", route: CarRoutes },
    { path: "/drivers", route: DriverRoutes },
    { path: "/trips", route: TripRoutes },
    { path: "/expenses", route: ExpenseRoutes },
    { path: "/dashboard", route: DashboardRoutes },
    { path: "/users", route: UserRoutes },
];

moduleRoutes.forEach(({ path, route }) => router.use(path, route));

export const indexRoute = router;
