package com.examflow.backend.service;

import com.examflow.backend.dto.CategoryDto;
import com.examflow.backend.entity.Category;
import com.examflow.backend.entity.User;
import com.examflow.backend.exception.BusinessException;
import com.examflow.backend.exception.ResourceNotFoundException;
import com.examflow.backend.repository.CategoryRepository;
import com.examflow.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> findAll() {
        return categoryRepository.findAll().stream().map(this::toMap).toList();
    }

    public Map<String, Object> findById(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        return toMap(cat);
    }

    public Map<String, Object> create(CategoryDto dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Category cat = new Category();
        cat.setName(dto.getName());
        cat.setDescription(dto.getDescription());
        cat.setCreatedBy(user);

        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", dto.getParentId()));
            cat.setParent(parent);
        }

        return toMap(categoryRepository.save(cat));
    }

    public Map<String, Object> update(Long id, CategoryDto dto) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));

        if (dto.getName() != null) cat.setName(dto.getName());
        if (dto.getDescription() != null) cat.setDescription(dto.getDescription());

        if (dto.getParentId() != null) {
            Category parent = categoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", dto.getParentId()));
            cat.setParent(parent);
        }

        return toMap(categoryRepository.save(cat));
    }

    public void delete(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category", id);
        }
        categoryRepository.deleteById(id);
    }

    private Map<String, Object> toMap(Category cat) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", cat.getId());
        m.put("name", cat.getName());
        m.put("description", cat.getDescription());
        m.put("parentId", cat.getParent() != null ? cat.getParent().getId() : null);
        m.put("parentName", cat.getParent() != null ? cat.getParent().getName() : null);
        m.put("createdAt", cat.getCreatedAt());
        return m;
    }
}
