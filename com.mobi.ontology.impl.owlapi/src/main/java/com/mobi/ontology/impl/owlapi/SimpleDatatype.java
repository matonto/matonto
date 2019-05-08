package com.mobi.ontology.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.rdf.api.IRI;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.vocab.OWL2Datatype;
import uk.ac.manchester.cs.owl.owlapi.OWLDatatypeImpl;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleDatatype implements Datatype {
    
    private IRI iri;
    private OWLDatatype owlDatatype;
    private boolean builtin;

    
    public SimpleDatatype(@Nonnull IRI iri) {
        this.iri = iri;
        org.semanticweb.owlapi.model.IRI owlIri = SimpleOntologyValues.owlapiIRI(iri);
        owlDatatype = new OWLDatatypeImpl(owlIri);
        builtin = owlDatatype.isBuiltIn();
    }
    
    
    @Override
    public boolean isString() {
        return owlDatatype.isString();
    }

    
    @Override
    public boolean isInteger() {
        return owlDatatype.isInteger();
    }

    
    @Override
    public boolean isFloat()   {
        return owlDatatype.isFloat();
    }

    
    @Override
    public boolean isDouble() {
        return owlDatatype.isDouble();
    }

    
    @Override
    public boolean isBoolean() {
        return owlDatatype.isBoolean();
    }

    
    @Override
    public boolean isRDFPlainLiteral() {
        return owlDatatype.isRDFPlainLiteral();
    }
    
    
    @Override
    public IRI getIRI() {
        return iri;
    }
    
    public static Set<IRI> getDatatypeIRIs() {
        Set<IRI> iris = new HashSet<>();
        Set<org.semanticweb.owlapi.model.IRI> owlapiIris = OWL2Datatype.getDatatypeIRIs();
        for (org.semanticweb.owlapi.model.IRI i : owlapiIris) {
            iris.add(SimpleOntologyValues.mobiIRI(i));
        }
        
        return iris;
    }
    
    
    public String getShortForm() {
        if (builtin) {
            return owlDatatype.getBuiltInDatatype().getShortForm();

        } else {
            throw new MobiOntologyException(iri + " is not a built in datatype");
        }
    }
    
    
    public String getPatternString() {
        if (builtin) {
            return owlDatatype.getBuiltInDatatype().getPatternString();
        } else {
            throw new MobiOntologyException(iri + " is not a built in datatype");
        }
    }
    
    
    public String getPrefixedName() {
        if (builtin) {
            return owlDatatype.getBuiltInDatatype().getPrefixedName();
        } else {
            throw new MobiOntologyException(iri + " is not a built in datatype");
        }
    }
    
    
    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }

        if (obj instanceof Datatype) {
            Datatype other = (Datatype) obj;
            return iri.equals(other.getIRI());
        }
        
        return false;
    }
    
    
    @Override
    public int hashCode() {
        return owlDatatype.hashCode();
    }
}
