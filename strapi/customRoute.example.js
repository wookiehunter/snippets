module.exports = {
    routes: [
      {
        "method": "POST",
        "path": "/invoice/make/:id",
        "handler": "invoice.make",
        "config": {
          "auth": false,
        },
      },
    ],
  };
  