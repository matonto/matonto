package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.DisjointObjectPropertiesAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleDisjointObjectPropertiesAxiom 
	extends SimpleAxiom 
	implements DisjointObjectPropertiesAxiom {

	
	private Set<ObjectPropertyExpression> properties;
	
	public SimpleDisjointObjectPropertiesAxiom(Set<ObjectPropertyExpression> properties, Set<Annotation> annotations) 
	{
		super(annotations);
		this.properties = new TreeSet<ObjectPropertyExpression>(Preconditions.checkNotNull(properties, "properties cannot be null"));;
	}

	
	@Override
	public DisjointObjectPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDisjointObjectPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}

	
	@Override
	public DisjointObjectPropertiesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleDisjointObjectPropertiesAxiom(properties, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DISJOINT_OBJECT_PROPERTIES;
	}

	
	@Override
	public Set<ObjectPropertyExpression> getObjectPropertys() 	
	{
		return new HashSet<ObjectPropertyExpression> (properties);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DisjointObjectPropertiesAxiom) {
			DisjointObjectPropertiesAxiom other = (DisjointObjectPropertiesAxiom)obj;			 
			return properties.equals(other.getObjectPropertys());
		}
		
		return false;
	}

}
