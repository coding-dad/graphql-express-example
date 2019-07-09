const express = require("express");

const graphqlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");

// Schema definitions
const schema = buildSchema(`
    type Query {
      employees: [Employee]
      employee(id: Int): Employee
      customers: [Customer] 
      customer(id: String): Customer
      orders: [Order]
    }

    type EmployeeAddress { 
      street: String
      city: String
      region: String
      postalCode: Int
      country: String
      phone: String
    }
    
    type Employee { 
      employeeID: Int
      lastName: String
      firstName: String
      title: String
      titleOfCourtesy: String
      birthDate: String
      hireDate: String
      notes: String
      reportsTo: String
      territoryIDs: [Int ]
      address: EmployeeAddress 
    }

    type CustomerAddress { 
        street: String
        city: String
        region: String
        postalCode: Int
        country: String
        phone: String 
    }
    
    type Customer { 
        customerID: String
        companyName: String
        contactName: String
        contactTitle: String
        address: CustomerAddress
    }

    type OrderDetails { 
      productID: Int
      unitPrice: Int
      quantity: Int
      discount: Int 
    }
    
    type OrderShipAddress {
      street: String
      city: String
      region: String
      postalCode: Int
      country: String 
    }
    
    type Order { 
      orderID: Int
      customerID: String
      _customer: Customer
      employeeID: Int
      _employee: Employee
      orderDate: String
      requiredDate: String
      shippedDate: String
      shipVia: Int
      freight: Float
      shipName: String
      details: [OrderDetails ]
      shipAddress: OrderShipAddress 
    }

`);

/**
 * Load the famous Northwind data asynchronous
 * from Github and return results
 *
 * Thanks to https://github.com/graphql-compose
 */
const loadFromUrl = async json_file => {
  const fetch = require("node-fetch");

  const url = `https://raw.githubusercontent.com/graphql-compose/graphql-compose-examples/master/examples/northwind/data/json/${json_file}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    return data;
  } catch (e) {
    console.log("Error getting data.", e);
  }
};

// The data 'tables' we will work with
let employees, customers, orders;

/**
 * Loading the famous Northwind data from Github
 */
const loadData = async () => {
  employees = await loadFromUrl("employees.json");
  customers = await loadFromUrl("customers.json");

  const json_orders = await loadFromUrl("orders.json");

  // Now we create fields with references between the data objects
  for (let order of json_orders) {
    order._customer = getCustomerByID(order.customerID);
    order._employee = getEmployeeByID(order.employeeID);
  }

  orders = json_orders;
};

// Resolver methods
const getCustomerByID = customerID => {
  const filtered = customers.filter(customer => {
    return customer.customerID === customerID;
  });

  return filtered[0];
};

const getEmployeeByID = employeeID => {
  const filtered = employees.filter(
    employee => employee.employeeID === employeeID
  );
  return filtered[0];
};

// Setting the Graph's root
const root = {
  employees: () => employees,
  employee: query => getEmployeeByID(query.id),
  customers: () => customers,
  customer: query => getCustomerByID(query.id),
  orders: () => orders
};

/**
 * Instantiating the Express http server and set routes
 */

const app = express();

// Root route just for orientation
app.get("/", (req, res) =>
  res.send(`
  <html>
    <body>
      <p>Use the Interactive GraphQL interface 
      <a href="/graphql">here</a>.
      </p>
      <p>
        Here an example query for <a href="/graphql?query={ customers { customerID companyName contactTitle contactName }}">all customers</a>
      </p>
      <p>
        And here an example query for a <a href='/graphql?query={  customer(id: "BLAUS") { customerID companyName contactTitle contactName }}'>specific customer with ID 'BLAUS'</a>
      </p>
      <p>
        And here is a <a href='/graphql?query=query { orders { orderID employeeID _employee { employeeID firstName lastName } shipName customerID _customer { customerID companyName } } }'><b>more complex query</b></a> with references between employees, customers and their orders. 
      </p>
    </body>
  </html>`)
);

// graphQL route to the interactive GraphQL frontend
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);

/**
 * Loading the data and starting the express server
 */

loadData().then(() => {
  app.listen(8080, () => console.log("Now browse to localhost:8080/graphql"));
});
