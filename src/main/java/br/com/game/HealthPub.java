package br.com.game;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/api/health")
public class HealthPub {

    @GET
    @Path("/health")
    public Response getHealth(){
        return Response.ok("API is healthy. Its On Line").build();
    }
}
